import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';

/** One entry on the "Our Journey" timeline (Figma Timeline_Node_1..6). */
interface JourneyNode {
  /** Overline shown on desktop (Figma web: "Principle" / "Where We Are Headed"). */
  labelKey: string;
  /** Overline shown on mobile when it differs (Figma mobile node 1: "Today"). */
  mobileLabelKey?: string;
  titleKey: string;
  descKey: string;
  final?: boolean;
}

/** Benefit card in "What that actually gets you" (Figma Advantages_Section). */
interface AdvantageCard {
  icon: string;
  titleKey: string;
  descKey: string;
}

/**
 * Who We Are page, pixel-perfect from Figma web 1665:88349 + mobile
 * 1665:88730: hero with the role-map illustration, the dark "Our Journey"
 * animated timeline, the four-benefit grid, and the geometric CTA band.
 *
 * The Figma prototype loops its 8.2s reveal timeline for preview; on the
 * live page each animated section plays the exact same keyframes ONCE when
 * it first scrolls into view (IntersectionObserver adds `is-live`).
 */
@Component({
  selector: 'app-who-we-are-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './who-we-are-page.component.html',
  styleUrl: './who-we-are-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhoWeArePageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('journey') private journeyRef?: ElementRef<HTMLElement>;
  @ViewChild('cta') private ctaRef?: ElementRef<HTMLElement>;

  protected readonly requestDemoRoute = `/${LmsRoutes.RequestDemo}`;

  protected readonly journeyNodes: JourneyNode[] = [
    {
      labelKey: 'feature.who_we_are.journey.nodes.begin.label',
      mobileLabelKey: 'feature.who_we_are.journey.nodes.begin.label_mobile',
      titleKey: 'feature.who_we_are.journey.nodes.begin.title',
      descKey: 'feature.who_we_are.journey.nodes.begin.desc',
    },
    {
      labelKey: 'feature.who_we_are.journey.principle',
      titleKey: 'feature.who_we_are.journey.nodes.real.title',
      descKey: 'feature.who_we_are.journey.nodes.real.desc',
    },
    {
      labelKey: 'feature.who_we_are.journey.principle',
      titleKey: 'feature.who_we_are.journey.nodes.language.title',
      descKey: 'feature.who_we_are.journey.nodes.language.desc',
    },
    {
      labelKey: 'feature.who_we_are.journey.principle',
      titleKey: 'feature.who_we_are.journey.nodes.record.title',
      descKey: 'feature.who_we_are.journey.nodes.record.desc',
    },
    {
      labelKey: 'feature.who_we_are.journey.principle',
      titleKey: 'feature.who_we_are.journey.nodes.earned.title',
      descKey: 'feature.who_we_are.journey.nodes.earned.desc',
    },
    {
      labelKey: 'feature.who_we_are.journey.nodes.headed.label',
      titleKey: 'feature.who_we_are.journey.nodes.headed.title',
      descKey: 'feature.who_we_are.journey.nodes.headed.desc',
      final: true,
    },
  ];

  protected readonly advantages: AdvantageCard[] = [
    {
      icon: 'assets/who-we-are/icon-medal.svg',
      titleKey: 'feature.who_we_are.advantages.certificates.title',
      descKey: 'feature.who_we_are.advantages.certificates.desc',
    },
    {
      icon: 'assets/who-we-are/icon-circles-three-plus.svg',
      titleKey: 'feature.who_we_are.advantages.bilingual.title',
      descKey: 'feature.who_we_are.advantages.bilingual.desc',
    },
    {
      icon: 'assets/who-we-are/icon-chats-circle.svg',
      titleKey: 'feature.who_we_are.advantages.connected.title',
      descKey: 'feature.who_we_are.advantages.connected.desc',
    },
    {
      icon: 'assets/who-we-are/icon-identification-badge.svg',
      titleKey: 'feature.who_we_are.advantages.personalization.title',
      descKey: 'feature.who_we_are.advantages.personalization.desc',
    },
  ];

  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    // Play each section's Figma timeline once, the first time it appears.
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-live');
            this.observer?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.2 },
    );
    if (this.journeyRef) this.observer.observe(this.journeyRef.nativeElement);
    if (this.ctaRef) this.observer.observe(this.ctaRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
